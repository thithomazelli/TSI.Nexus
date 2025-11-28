using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Services
{
    public sealed class AddressService : IAddressService
    {
        #region Properties

        /// <summary>
        /// Repository object created to access the Addresses registers on database using EntityFramework.
        /// </summary>
        private readonly IRepository<Address> _repository;

        #endregion Properties

        #region Public methods

        /// <summary>
        /// AddressService constructor created to initialize the "_repository" using Dependency Injection.
        /// </summary>
        /// <param name="repository">IRepository<StudentFrequentView> object used to initialize the internal variable using Dependency Injection.</param>
        public AddressService(IRepository<Address> repository)
        {
            _repository = repository;
        }

        /// <inheritdoc />
        public WebApiResponse<Address> Add(Address address)
        {
            WebApiResponse<Address> result = new();

            try
            {
                _repository.Add(address);

                result.Data = address;
                result.Status = ResponseStatus.Success;
                result.Message = "Endereço cadastrado com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível cadastrar o Endereço na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public WebApiResponse<Address> Update(Address address)
        {
            WebApiResponse<Address> result = new();

            try
            {
                _repository.Update(address);

                result.Data = address;
                result.Status = ResponseStatus.Success;
                result.Message = "Endereço atualizado com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível atualizar o Endereço na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public WebApiResponse<Address> Remove(Address address)
        {
            WebApiResponse<Address> result = new();

            try
            {
                _repository.Remove(address);

                result.Data = address;
                result.Status = ResponseStatus.Success;
                result.Message = "Endereço removido com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível remover o Endereço na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public WebApiResponse<Address> FindById(int? id)
        {
            WebApiResponse<Address> result = new();

            try
            {
                result.Data = _repository.GetById(id);
                result.Status = ResponseStatus.Success;
                result.Message = result.Data != null
                    ? "Endereço foi encontrado com sucesso"
                    : $"Nenhum Endereço com o ID {id} foi encontrado";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível acessar os registros de Endereço na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public WebApiResponse<IEnumerable<Address>> FindByPersonId(int? personId)
        {
            WebApiResponse<IEnumerable<Address>> result = new();

            try
            {
                result.Data = _repository.Query(_ => _.PersonId.Equals(personId));
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data.Count()} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível acessar os registros de Endereço na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        #endregion Public methods

        #region Private methods

        #endregion Private methos
    }
}
