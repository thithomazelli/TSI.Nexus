using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Services
{
    public sealed class CompanyService : ICompanyService
    {
        #region Properties

        /// <summary>
        /// Repository object created to access the Company registers on database using EntityFramework.
        /// </summary>
        private readonly IRepository<Company> _repository;

        #endregion Properties

        #region Public methods

        /// <summary>
        /// CompanyService constructor created to initialize the "_repository" using Dependency Injection.
        /// </summary>
        /// <param name="repository">IRepository<Company> object used to initialize the internal variable using Dependency Injection.</param>
        public CompanyService(IRepository<Company> repository)
        {
            _repository = repository;
        }

        /// <inheritdoc />
        public WebApiResponse<Company> Add(Company Company)
        {
            WebApiResponse<Company> result = new();

            try
            {
                var CompanyDuplicatedMessage = CheckIfCompanyIsDuplicatedAndGetErrorMessage(Company);

                if (!string.IsNullOrEmpty(CompanyDuplicatedMessage))
                {
                    result.Status = ResponseStatus.Error;
                    result.Message = CompanyDuplicatedMessage;
                    return result;
                }

                _repository.Add(Company);

                result.Data = Company;
                result.Status = ResponseStatus.Success;
                result.Message = $"Cliente {Company.Name} cadastrado com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível cadastrar o Cliente {Company.Name} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public WebApiResponse<Company> Update(Company Company)
        {
            WebApiResponse<Company> result = new();

            try
            {
                var CompanyDuplicatedMessage = CheckIfCompanyIsDuplicatedAndGetErrorMessage(Company);

                if (!string.IsNullOrEmpty(CompanyDuplicatedMessage))
                {
                    result.Status = ResponseStatus.Error;
                    result.Message = CompanyDuplicatedMessage;
                    return result;
                }

                _repository.Update(Company);

                result.Data = Company;
                result.Status = ResponseStatus.Success;
                result.Message = $"Cliente {Company.Name} atualizado com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível atualizar os dados do Cliente {Company.Name} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public WebApiResponse<Company> Remove(Company Company)
        {
            WebApiResponse<Company> result = new();

            try
            {
                _repository.Remove(Company);

                result.Data = Company;
                result.Status = ResponseStatus.Success;
                result.Message = $"Cliente {Company.Name} removido com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível remover o Cliente {Company.Name} da base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public WebApiResponse<IEnumerable<Company>> FindAll()
        {
            WebApiResponse<IEnumerable<Company>> result = new();

            try
            {
                result.Data = _repository.GetAll();
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data.Count()} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public WebApiResponse<Company> FindById(int? id)
        {
            WebApiResponse<Company> result = new();

            try
            {
                result.Data = _repository.GetById(id);
                result.Status = ResponseStatus.Success;
                result.Message = result.Data != null
                    ? $"Cliente {result.Data.Name} encontrado com sucesso"
                    : $"Nenhum Cliente com o ID {id} foi encontrado";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public WebApiResponse<IEnumerable<Company>> FindByEmail(string email)
        {
            WebApiResponse<IEnumerable<Company>> result = new();

            try
            {
                result.Data = _repository.Query(_ => _.Email.Contains(email));
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data.Count()} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public WebApiResponse<Company> FindByNationalRegistry(string nationalRegistry)
        {
            WebApiResponse<Company> result = new();

            try
            {
                result.Data = _repository.Query(_ => _.NationalRegistry.Equals(nationalRegistry))?.FirstOrDefault();
                result.Status = ResponseStatus.Success;
                result.Message = result.Data != null
                    ? $"Cliente {result.Data.Name} encontrado com sucesso."
                    : $"Nenhum Cliente com o CNPJ {nationalRegistry} foi encontrado";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível acessar os registros de Clientes na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        #endregion Public methods

        #region Private methods

        /// <summary>
        /// Should verify if the Company is already being registered on the database.
        /// </summary>
        /// <param name="Company">The Company object that is being added or updated.</param>
        /// <returns>The error message when Company is duplicated. Otherwise an empty string.</returns>
        private string CheckIfCompanyIsDuplicatedAndGetErrorMessage(Company Company)
        {
            if (IsNameDuplicated(Company))
            {
                return $"Já existe um Cliente cadastrado com Nome {Company.Name}.";
            }

            if (IsEmailDuplicated(Company))
            {
                return $"Já existe um Cliente cadastrado com E-mail {Company.Email}.";
            }

            if (IsNationalRegistryDuplicated(Company))
            {
                return $"Já existe um Cliente cadastrado com o CNPJ {Company.NationalRegistry}.";
            }

            return string.Empty;
        }

        /// <summary>
        /// Should verify if the Company email is already being used by another register on the database.
        /// </summary>
        /// <param name="Company">The Company object that is being added or updated.</param>
        /// <returns>True when the Email is duplicated; Otherwise false.</returns>
        private bool IsEmailDuplicated(Company Company)
        {
            return _repository
                .Query(_ => _.Id != Company.Id && !string.IsNullOrEmpty(_.Email) && _.Email == Company.Email)
                .Any();
        }

        /// <summary>
        /// Should verify if the Company name is already being used by another register on the database.
        /// </summary>
        /// <param name="Company">The Company object that is being added or updated.</param>
        /// <returns>True when the Name is duplicated; Otherwise false.</returns>
        private bool IsNameDuplicated(Company Company)
        {
            return _repository
                .Query(_ => _.Id != Company.Id && _.Name == Company.Name)
                .Any();
        }

        /// <summary>
        /// Should verify if the Company NationalRegistry is already being used by another register on the database.
        /// </summary>
        /// <param name="Company">The Company object that is being added or updated.</param>
        /// <returns>True when the NationalIDCard is duplicated; Otherwise false.</returns>
        private bool IsNationalRegistryDuplicated(Company Company)
        {
            return _repository
                .Query(_ => _.Id != Company.Id && !string.IsNullOrEmpty(_.NationalRegistry) &&
                            _.NationalRegistry == Company.NationalRegistry)
                .Any();
        }

        #endregion Private methods
    }
}
