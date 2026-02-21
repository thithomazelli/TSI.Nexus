using AutoMapper;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Services
{
    public sealed class BusinessPartnerService : IBusinessPartnerService
    {
        #region Properties

        /// <summary>
        /// Repository object created to access the BusinessPartner registers on database using EntityFramework.
        /// </summary>
        private readonly IRepository<BusinessPartner> _repository;
        private readonly IMapper _mapper;

        #endregion Properties

        #region Public methods

        /// <summary>
        /// BusinessPartnerService constructor created to initialize the "_repository" using Dependency Injection.
        /// </summary>
        /// <param name="repository">IRepository<BusinessPartner> object used to initialize the internal variable using Dependency Injection.</param>
        /// <param name="mapper">Mapper object used to initialize the internal variable using Dependency Injection.</param>
        public BusinessPartnerService(IRepository<BusinessPartner> repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<BusinessPartnerDto>> Remove(BusinessPartnerDto businessPartnerDto)
        {
            WebApiResponse<BusinessPartnerDto> result = new();

            try
            {
                var businessPartner = await _repository.GetByIdAsync(businessPartnerDto.Id);
                if (businessPartner == null)
                {
                    throw new Exception($"BusinessPartnere com Id {businessPartnerDto.Id} não encontrado.");
                }

                await _repository.RemoveAsync(businessPartner);

                result.Data = businessPartnerDto;
                result.Status = ResponseStatus.Success;
                result.Message = $"BusinessPartnere {businessPartner.Name} removido com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível remover o BusinessPartnere {businessPartnerDto.Name} da base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<BusinessPartnerDto>>> FindAll()
        {
            WebApiResponse<IEnumerable<BusinessPartnerDto>> result = new();

            try
            {
                var businessPartners = await _repository.GetAllAsync(c => c.Addresses);

                result.Data = _mapper.Map<IEnumerable<BusinessPartnerDto>>(businessPartners);
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data.Count()} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de BusinessPartneres na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<BusinessPartnerDto>> FindById(int? id)
        {
            WebApiResponse<BusinessPartnerDto> result = new();

            try
            {
                var businessPartnerEntity = await _repository.GetByIdAsync(id);
                result.Data = _mapper.Map<BusinessPartnerDto>(businessPartnerEntity);
                result.Status = ResponseStatus.Success;
                result.Message =
                    result.Data != null
                        ? $"BusinessPartnere {result.Data.Name} encontrado com sucesso"
                        : $"Nenhum BusinessPartnere com o ID {id} foi encontrado";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de BusinessPartneres na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<BusinessPartnerDto>> FindByEmail(string email)
        {
            WebApiResponse<BusinessPartnerDto> result = new();

            try
            {
                var businessPartnerEntity = await _repository.FirstOrDefaultAsync(x => x.Email == email);
                result.Data = _mapper.Map<BusinessPartnerDto>(businessPartnerEntity);
                result.Status = ResponseStatus.Success;
                result.Message =
                    result.Data != null
                        ? $"BusinessPartnere {result.Data.Name} encontrado com sucesso."
                        : $"Nenhum BusinessPartnere com o E-mail {email} foi encontrado";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de BusinessPartneres na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        #endregion Public methods

        #region Private methods

        #endregion Private methods
    }
}
